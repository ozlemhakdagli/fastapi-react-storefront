<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Kullanicilar extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->helper('url');
		$this->load->database();
		$this->load->library('session');
		$this->load->model('Database_Model');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	{	$data['sayfa']='Kullanıcılar' ;	
		$query=$this->db->get("kullanicilar");
		$data["veri"]=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/kullanicilar_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function edit($id)
	{	$data['sayfa']='Kullanıcı Düzenle' ;	
		$sorgu=$this->db->query("SELECT * FROM kullanicilar WHERE ID=$id");
		$data["veri"]=$sorgu->result();
	$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/kullanici_duzenle',$data);
		$this->load->view('admin/footer');
			
	
		
		
	}
	public function guncellekaydet($id)
	{		
		$data=array(
			'adiSoyadi'  => $this->input->post('adiSoyadi'),
			'email' => $this->input->post('email'),
			'sifre' => $this->input->post('sifre'),
			'yetki' => $this->input->post('yetki'),
			'durum' => $this->input->post('durum'),
			'resim' => $this->input->post('resim')
			);
			$this->Database_Model->update_data("kullanicilar",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelle işlemi başarılıdır!');
			redirect (base_url()."/admin/kullanicilar");
			
		
		
	}

	public function delete($id)
	{		
		$this->db->query("DELETE FROM kullanicilar WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."/admin/kullanicilar");
			
		
		
	}
	public function preview($id)
	{	
        $data['sayfa']='Kullanıcı Görüntüle' ;	
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$sorgu=$this->db->query("SELECT * FROM kullanicilar WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/kullanici_goster',$data);
		$this->load->view('admin/footer');
			
	}
}
