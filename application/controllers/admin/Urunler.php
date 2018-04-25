<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Urunler extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library(array('upload','session'));
		$this->load->helper('url');
		$this->load->database();
		
		$this->load->model('Database_Model');
		$this->load->helper(array('form','url'));
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	
	{   $data["sayfa"]='Ürünler';
	    $data["veriler"]=$this->Database_Model->urunler_get();
	    $this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/urunler_listesi',$data);
		$this->load->view('admin/footer');
		
		
		
	}
	
	public function ekle()
	{	
		$data["sayfa"]='Ürün Ekle';
		$query=$this->db->query("select * from turu order by adi");
		$data['turler']=$query->result();
		$query=$this->db->query("select * from kategoriler order by adi");
		$data['kategoriler']=$query->result();
		$this->load->view('admin/urunler_ekle',$data);
		
		
		
	}
	public function kaydet()
	{		
		$data=array(
			'adi'   => $this->input->post('adi'),
			'turu' => $this->input->post('turu'),
			'kodu' => $this->input->post('kodu'),
			'stok' => $this->input->post('stok'),
			'durum' => $this->input->post('durum'),
			'kisa_aciklama' => $this->input->post('kisa_aciklama'),
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords'),
			'kategori_id' => $this->input->post('kategori_id'),
			'sfiyat' => $this->input->post('sfiyat'),
			'afiyat' => $this->input->post('afiyat'),
			'uzun_aciklama' => $this->input->post('uzun_aciklama'),
			);
			$this->Database_Model->insert_data("urunler",$data);
			$this->session->set_flashdata('sonuc','Ürün ekleme işlemi başarılıdır!');
			redirect (base_url()."/admin/urunler");
			
		
		
	}
	
	public function edit($id)
	{		$query=$this->db->query("select * from turu order by adi");
		$data['turler']=$query->result();
		$query=$this->db->query("select * from kategoriler order by adi");
		$data['kategoriler']=$query->result();
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$data["sayfa"]='Ürün Düzenle';
	    $this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/urunler_duzenle',$data);
		$this->load->view('admin/footer');
			
	
		
		
	}
	public function guncellekaydet($id)
	{		
		$data=array(
			'adi'   => $this->input->post('adi'),
			'turu' => $this->input->post('turu'),
			'kategori_id' => $this->input->post('kategori_id'),
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords'),
			'sfiyat' => $this->input->post('sfiyat'),
			'durum' => $this->input->post('durum'),
			'kisa_aciklama' => $this->input->post('kisa_aciklama'),
			'uzun_aciklama' => $this->input->post('uzun_aciklama')
			);
			$this->Database_Model->update_data("urunler",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelle işlemi başarılıdır!');
			redirect (base_url()."admin/urunler");
			
		
		
	}

	public function delete($id)
	{		
		$this->db->query("DELETE FROM urunler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/urunler");
			
		
		
	}
	public function preview($id)
	{		
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
	    $data["sayfa"]='Ürün Göster';
		$data["kat"]=$this->Database_Model->urun_get($id);
	    $this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/urunler_goster',$data);
		$this->load->view('admin/footer');
			
	}
		public function goster($id)
	{	
		$sorgu =$this->db->query("SELECT * FROM urunler WHERE Id=$id");
		$data["veri"]=$sorgu->result();
        	$data["sayfa"]='Ürün Göster';
		$this->load->view('admin/urunler_goster',$data);
		
		
		
	}
	
		public function resim_ekleme($id)
	{	
			$data["sayfa"]='Resim Ekle';
		
		$data["id"]=$id;
		$this->load->view('admin/urunler_resim_ekleme_formu',$data);
		
		
	}
	public function resim_ekle_kaydet($id)
	{	
		
		$data["id"]=$id;
		$config['upload_path']          = './uploads/';
        $config['allowed_types']        = 'gif|jpg|png|jpeg';
        $config['max_size']             = 1500;
        $config['max_width']            = 1500;
        $config['max_height']           = 1500;
		$this->load->library('upload', $config);
		$this->upload->initialize($config);
		
		if ( ! $this->upload->do_upload('resim'))
                {
                        $error = array('error' => $this->upload->display_errors());

						$data["error"] = $error;
						$this->session->set_flashdata('mesaj','Resim istenen kriterlere uymamaktadır.');
						$this->load->view('admin/urunler_resim_ekleme_formu',$data);
                        
                }
                else
                {
                    	$upload_data = $this->upload->data();				
			            $file_name =$upload_data['file_name']; //Yüklediği resmin adı 
						$data=array(
							'resim' =>$file_name
			
						);
						$this->load->model('Database_Model');
						$this->Database_Model->update_data("urunler",$data,$id);
						$this->session->set_flashdata('mesaj','Ürün resmi yüklendi.',$file_name);
						redirect (base_url()."admin/urunler");
				}
	}
		      

                
				

               
      
		public function resim_galeri_ekleme($id)
	{					
		$sorgu=$this->db->query("SELECT * FROM urunler_resim WHERE urunler_id= $id");
		$data["veriler"]=$sorgu->result();
		$data["id"] =$id;
			$data["sayfa"]='Galeri Ekleme';
		$this->load->view('admin/urunler_resim_galeri_ekleme_formu',$data);
		
		
	}
		 public function resim_galeri_upload($id)
        {
                $config['upload_path']          = './uploads/';
                $config['allowed_types']        = 'gif|jpg|png|jpeg';
                $config['max_size']             = 1000;
                $config['max_width']            = 3000;
                $config['max_height']           = 3000;

                $this->load->library('upload', $config);
				$this->upload->initialize($config);

                if ( ! $this->upload->do_upload('resim'))
                {
                        
						
						$this->session->set_flashdata('sonuc','Hatalıdır');
						redirect (base_url()."admin/urunler/resim_galeri_ekleme/$id");
                        
                }
                else
                {		$data = $this->upload->data();
				echo $dosyaadi= $data["file_name"];
                        $data=array(
							'urunler_id' => $id,
							'resim' => $dosyaadi
						);
						$this->Database_Model->insert_data("urunler_resim",$data);
				
                        $this->session->set_flashdata('sonuc','Başarılıdır');
						redirect (base_url()."admin/urunler/resim_galeri_ekleme/$id");
                }
        }
		public function resimsil($rid,$id)
	{	
		
		$this->db->query("DELETE FROM urunler_resim WHERE Id=$rid");
		$this->session->set_flashdata('sonuc','Silme işlemi gerçekleşmiştir.');
		redirect (base_url()."admin/urunler/resim_galeri_ekleme/$id");
		
	}
		public function kategori_ekle()
	{	
		
		
		
			$data["sayfa"]='Kategori Ekle';
		$this->load->view('admin/kategori_ekle',$data);
		
		
	}
	public function kategori_kaydet()
	{	
		
		$data=array(
			'adi'   => $this->input->post('adi'),							
			'durum' => $this->input->post('durum'),			
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords'),		
						
			);
			$this->Database_Model->insert_data("kategoriler",$data);
			$this->session->set_flashdata('sonuc','Kategori ekleme işlemi başarılıdır!');
			redirect (base_url()."admin/urunler/kategoriler");
		
	}
	public function kategoriler()
	{
			$data["sayfa"]='Kategoriler';
		$sorgu=$this->db->query("SELECT * FROM kategoriler ");
		$data["kategoriler"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/kategori_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
	
		public function marka_ekle()
	{	
			$data["sayfa"]='Marka Ekle';
		$this->load->view('admin/marka_ekle',$data);
		
	}
	public function marka_kaydet()
	{	
		
		$data=array(
			'adi'   => $this->input->post('adi'),							
			'durum' => $this->input->post('durum'),			
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords'),		
						
			);
			$this->Database_Model->insert_data("turu",$data);
			$this->session->set_flashdata('sonuc','Marka ekleme işlemi başarılıdır!');
			redirect (base_url()."/admin/urunler/markalar");
		
	}
	public function markalar()
	{
		$data["sayfa"]='Markalar';
		$sorgu=$this->db->query("SELECT * FROM turu ");
		$data["markalar"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/marka_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
}
