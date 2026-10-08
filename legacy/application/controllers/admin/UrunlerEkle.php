<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class UrunlerEkle extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
		
		$this->load->helper('url');
		$this->load->library('session');
		$this->load->database();
		$this->load->model('Database_Model');
	} 
	
	public function index()
	{	
		$data["sayfa"]='Kategori Ekle';
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("urunler");
		$data["veriler"]=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/urunler_ekle',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function kaydet()
	{		
		$data=array(
			'adi'   => $this->input->post('adi'),
			'turu' => $this->input->post('turu'),
			'kodu' => $this->input->post('kodu'),
			'stok' => $this->input->post('stok'),
			'durum' => $this->input->post('durum'),
			'kısa_aciklama' => $this->input->post('kısa_aciklama'),
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
	
}
